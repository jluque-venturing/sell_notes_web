-- ============================================================
--  Setup permanente + flujo de confirmación / envío al Sheet
--  Pegar TODO esto en Supabase → SQL Editor → Run
-- ============================================================


-- ------------------------------------------------------------
-- 1) Tabla de setup permanente (una sola fila, id = 1)
--    Es lo que la app muestra siempre, salvo que exista un
--    daily_setup para la fecha de hoy (override puntual).
-- ------------------------------------------------------------
create table if not exists permanent_setup (
  id          smallint primary key default 1,
  product_ids jsonb       not null default '[]'::jsonb,
  updated_at  timestamptz not null default now(),
  constraint permanent_setup_una_sola_fila check (id = 1)
);

-- Arranca con todos los productos que hoy están activos
insert into permanent_setup (id, product_ids)
values (1, coalesce((select jsonb_agg(id) from products where is_active), '[]'::jsonb))
on conflict (id) do nothing;

-- Una tabla creada por SQL no hereda los permisos que el Table Editor
-- da solo: sin esto la app recibe "permission denied for table".
grant select, update on permanent_setup to anon, authenticated;

alter table permanent_setup enable row level security;

drop policy if exists permanent_setup_leer     on permanent_setup;
drop policy if exists permanent_setup_escribir on permanent_setup;

create policy permanent_setup_leer     on permanent_setup for select using (true);
create policy permanent_setup_escribir on permanent_setup for update using (true) with check (true);

-- Realtime, para que un cambio se refleje en los otros celulares
do $$
begin
  alter publication supabase_realtime add table permanent_setup;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;


-- ------------------------------------------------------------
-- 2) Campos nuevos en day_closes para el flujo de revisión
--
--    sales_snapshot     -> queda intacto (lo que cargaron ellas)
--    reviewed_snapshot  -> tu versión revisada (montos corregidos,
--                          Nº de operación, tildes)
-- ------------------------------------------------------------
alter table day_closes
  add column if not exists telegram_sent_at  timestamptz,
  add column if not exists confirmed_at      timestamptz,
  add column if not exists sheet_synced_at   timestamptz,
  add column if not exists sheet_rows_added  integer,
  add column if not exists reviewed_snapshot jsonb;

-- Los cierres viejos ya están en el doc a mano: los marcamos como
-- sincronizados para que no aparezcan como pendientes de revisar.
update day_closes
set sheet_synced_at = created_at,
    confirmed_at    = created_at
where close_date < '2026-07-01'
  and sheet_synced_at is null;


-- ------------------------------------------------------------
-- 3) Limpieza: borrar los setups por fecha
--    Desde ahora manda el permanente. Un daily_setup solo debe
--    existir cuando querés que UN día puntual sea distinto.
-- ------------------------------------------------------------
delete from daily_setup;


-- ------------------------------------------------------------
-- 4) OPCIONAL — borrar el cierre vacío duplicado del 12/7
--    Ese día se cerró dos veces; este es el que quedó sin ventas.
--    Descomentá la línea si querés eliminarlo.
-- ------------------------------------------------------------
-- delete from day_closes where id = 'fd6b9989-5283-4e5e-a710-14042a354a93';

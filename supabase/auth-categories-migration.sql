-- Run once after schema.sql and policies.sql.
create or replace function public.add_default_categories(target_user_id uuid)
returns void language sql security definer set search_path = public as $$
  insert into public.categories(user_id, name, color, icon)
  select target_user_id, name, color, icon from (values
    ('Groceries','#5B8C6B','shopping-basket'), ('Restaurants','#D9825B','utensils'), ('Coffee','#9A6A4F','coffee'),
    ('Gas','#537C91','fuel'), ('Shopping','#B8758D','shopping-bag'), ('Subscriptions','#7367A8','repeat'),
    ('Entertainment','#C29A43','ticket'), ('Travel','#4F8294','plane'), ('Health','#B95F62','heart-pulse'),
    ('Fitness','#5C9672','dumbbell'), ('Bills','#68747C','receipt'), ('Transfers','#6685A3','arrow-left-right'),
    ('Other','#858B86','circle-ellipsis')
  ) as defaults(name,color,icon) on conflict (user_id,name) do nothing;
$$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, email) values(new.id, new.email) on conflict (id) do nothing;
  perform public.add_default_categories(new.id); return new;
end; $$;
select public.add_default_categories(id) from auth.users;


-- Run while authenticated, replacing the UUID only for server-side setup if necessary.
insert into public.categories(user_id, name, color, icon)
select auth.uid(), name, color, icon from (values
 ('Groceries','#5B8C6B','shopping-basket'), ('Restaurants','#D9825B','utensils'), ('Coffee','#9A6A4F','coffee'),
 ('Gas','#537C91','fuel'), ('Shopping','#B8758D','shopping-bag'), ('Subscriptions','#7367A8','repeat'),
 ('Entertainment','#C29A43','ticket'), ('Travel','#4F8294','plane'), ('Health','#B95F62','heart-pulse'),
 ('Fitness','#5C9672','dumbbell'), ('Bills','#68747C','receipt'), ('Transfers','#6685A3','arrow-left-right'),
 ('Other','#858B86','circle-ellipsis')
) as defaults(name,color,icon)
on conflict (user_id,name) do nothing;


-- Add Lodging category (sort_order 15, pushing Other to 16)
update public.vendor_categories set sort_order = 16 where name = 'Other';

insert into public.vendor_categories (name, icon, default_budget_percentage, sort_order)
values ('Lodging', 'bed', 0.00, 15)
on conflict (name) do nothing;


-- Drop ALL existing policies on all tables
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- gaming_stations: public read, admin manage
CREATE POLICY "public_read_stations" ON public.gaming_stations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin_manage_stations" ON public.gaming_stations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- food_categories: public read, admin manage
CREATE POLICY "public_read_categories" ON public.food_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin_manage_categories" ON public.food_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- food_items: public read, admin manage
CREATE POLICY "public_read_food" ON public.food_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin_manage_food" ON public.food_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- admin_settings: public read, admin manage
CREATE POLICY "public_read_settings" ON public.admin_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin_manage_settings" ON public.admin_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- time_slots: public read, admin manage, user can reserve available slots
CREATE POLICY "public_read_slots" ON public.time_slots FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin_manage_slots" ON public.time_slots FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_reserve_slots" ON public.time_slots FOR UPDATE TO authenticated USING (status = 'available' OR (status = 'reserved' AND reserved_by = auth.uid()));

-- profiles: user sees own, admin sees all; user inserts/updates own
CREATE POLICY "user_select_profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_insert_profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_update_profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- bookings: user sees own, admin sees all; user inserts own; user/admin update/delete
CREATE POLICY "user_select_bookings" ON public.bookings FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_insert_bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_update_bookings" ON public.bookings FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_delete_bookings" ON public.bookings FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- cart_items: user manages own
CREATE POLICY "user_select_cart" ON public.cart_items FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_insert_cart" ON public.cart_items FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_update_cart" ON public.cart_items FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_delete_cart" ON public.cart_items FOR DELETE TO authenticated USING (user_id = auth.uid());

-- orders: user sees own, admin sees all; user inserts own; admin updates
CREATE POLICY "user_select_orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_insert_orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin_update_orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- order_items: user sees own order items, admin sees all; user inserts for own orders
CREATE POLICY "user_select_order_items" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "user_insert_order_items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- notifications: user sees own, admin manages all
CREATE POLICY "user_select_notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin_manage_notifications" ON public.notifications FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- user_roles: user sees own, admin manages all
CREATE POLICY "user_select_roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_manage_roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

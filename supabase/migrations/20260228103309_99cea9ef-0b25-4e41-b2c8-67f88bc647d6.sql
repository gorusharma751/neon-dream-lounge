
-- Drop ALL existing restrictive policies and recreate as PERMISSIVE

-- gaming_stations
DROP POLICY IF EXISTS "Anyone can view stations" ON gaming_stations;
DROP POLICY IF EXISTS "Admins can manage stations" ON gaming_stations;
CREATE POLICY "Anyone can view stations" ON gaming_stations FOR SELECT USING (true);
CREATE POLICY "Admins can manage stations" ON gaming_stations FOR ALL USING (has_role(auth.uid(), 'admin'));

-- food_categories
DROP POLICY IF EXISTS "Anyone can view categories" ON food_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON food_categories;
CREATE POLICY "Anyone can view categories" ON food_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON food_categories FOR ALL USING (has_role(auth.uid(), 'admin'));

-- food_items
DROP POLICY IF EXISTS "Anyone can view food" ON food_items;
DROP POLICY IF EXISTS "Admins can manage food" ON food_items;
CREATE POLICY "Anyone can view food" ON food_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage food" ON food_items FOR ALL USING (has_role(auth.uid(), 'admin'));

-- admin_settings
DROP POLICY IF EXISTS "Anyone can view settings" ON admin_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON admin_settings;
CREATE POLICY "Anyone can view settings" ON admin_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON admin_settings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- cart_items
DROP POLICY IF EXISTS "Users can manage own cart" ON cart_items;
CREATE POLICY "Users can manage own cart" ON cart_items FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (user_id = auth.uid());

-- bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete own bookings" ON bookings;
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can delete own bookings" ON bookings FOR DELETE USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- orders
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can update orders" ON orders FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- order_items
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can create order items" ON order_items;
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))));
CREATE POLICY "Users can create order items" ON order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- time_slots
DROP POLICY IF EXISTS "Anyone can view slots" ON time_slots;
DROP POLICY IF EXISTS "Admins can manage slots" ON time_slots;
DROP POLICY IF EXISTS "Users can reserve available slots" ON time_slots;
CREATE POLICY "Anyone can view slots" ON time_slots FOR SELECT USING (true);
CREATE POLICY "Admins can manage slots" ON time_slots FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can reserve available slots" ON time_slots FOR UPDATE USING (status = 'available' OR (status = 'reserved' AND reserved_by = auth.uid()));

-- user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
CREATE POLICY "Users can view own roles" ON user_roles FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage notifications" ON notifications FOR ALL USING (has_role(auth.uid(), 'admin'));

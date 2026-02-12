USE garage;

INSERT INTO users (login, password, first_name, last_name, role)
VALUES
  ('owner', 'owner', 'Olgierd', 'Marciniszyn', 'OWNER'),
  ('guest', 'guest', 'Gość', 'Gościsty', 'GUEST');

INSERT INTO cars (user_id, brand, model, year, power_hp, value, notes)
VALUES
  (1, 'Honda', 'Civic', 2004, 200, 35000.00, 'Pierwsze auto w garażu'),
  (1, 'Honda', 'Accord', 2010, 145, 10000.00, 'Auto na dojazdy do pracy'),
  (1, 'Porsche', '911 Carrera', 2018, 370, 520000.00, 'Klasyczna 911 do weekendowych przejażdżek'),
  (1, 'Nissan', 'Skyline R34', 1999, 280, 450000.00, 'JDM marzenie z dzieciństwa'),
  (1, 'Toyota', 'Supra MK4', 1994, 330, 420000.00, 'Legenda JDM po lekkim tuningu'),
  (1, 'Mazda', 'RX-7', 1993, 255, 280000.00, 'Wankel, który lubi wysokie obroty');

INSERT INTO services (car_id, user_id, date, type, description, cost)
VALUES
  (1, 1, '2024-01-10', 'SERVICE', 'Wymiana oleju', 300.00),
  (2, 1, '2024-02-05', 'FUEL', 'Tankowanie pod korek', 250.00),
  (1, 1, '2024-03-01', 'MOD', 'Nowe felgi', 1200.00),
  (3, 1, '2024-04-15', 'SERVICE', 'Przegląd okresowy + wymiana oleju', 1500.00),
  (3, 1, '2024-05-20', 'DRIVE', 'Track day na torze', 800.00),
  (4, 1, '2024-06-01', 'MOD', 'Montaż większej turbiny', 7000.00),
  (4, 1, '2024-06-10', 'SERVICE', 'Strojenie silnika po modach', 2500.00),
  (5, 1, '2024-07-05', 'FUEL', 'Tankowanie 98 oktan', 350.00),
  (5, 1, '2024-07-15', 'MOD', 'Nowy wydech', 3200.00),
  (6, 1, '2024-08-01', 'SERVICE', 'Regeneracja silnika Wankla', 9000.00),
  (6, 1, '2024-08-20', 'DRIVE', 'Nocna przejażdżka po mieście', 0.00);

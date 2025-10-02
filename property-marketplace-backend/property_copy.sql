INSERT INTO public."Property" (
  id, title, description, price, type, location, "createdAt",
  amenities, coordinates, "currentOwnerId", images, "isVerified",
  "listedAt", "listedById", "propertyId", "soldAt",
  specifications, status, "updatedAt", "verifiedAt",
  "verifiedById", area, bathrooms, bedrooms
) VALUES (
  3,
  '4 plots of Land for sale',
  'The property is located around eastern ibo land, flanked by two water sources',
  324000,
  'APPARTMENT',
  'Eastern Ibo 3223',
  '2025-09-22 20:40:56.666',
  ARRAY['Furnished'],
  '{"lat":6.674084,"lng":-1.565787}',
  9,
  ARRAY[
    'https://res.cloudinary.com/.../image1.png',
    'https://res.cloudinary.com/.../image2.png',
    'https://res.cloudinary.com/.../image3.png'
  ],
  TRUE,
  NULL,
  9,
  'cmfvlclt80001swe41ky892il',
  NULL,
  '{}'::json,
  'LISTED',
  '2025-09-27 00:23:14.37',
  '2025-09-23 19:51:48.971',
  6,
  4,
  39,
  4
);

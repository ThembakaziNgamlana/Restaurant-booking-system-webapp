CREATE TABLE table_booking (
    id SERIAL PRIMARY KEY,
    table_name text not null,
    capacity int not null,
    booked BOOLEAN DEFAULT FALSE,
    booked_by TEXT,
    username text,
    number_of_people int,
    contact_number int

);
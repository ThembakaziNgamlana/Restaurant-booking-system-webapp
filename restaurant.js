export default function restaurant(db) {
    async function getTables() {
        const tables = await db.any('SELECT * FROM table_booking WHERE booked = false');
        return tables;
    }

    async function bookTable(tableName, username, phoneNumber, seats) {
        const isBooked = await isTableBooked(tableName);
        if (isBooked) {
            return 'Table is already booked.';
        }

        const table = await db.one('SELECT capacity FROM table_booking WHERE name = $1', [tableName]);

        if (seats > table.capacity) {
            return 'Table capacity exceeded.';
        }

        await db.none('INSERT INTO table_booking (name, booked_by, capacity, booked) VALUES ($1, $2, $3, $4)', [tableName, username, phoneNumber, seats, true]);
        return 'Table booked successfully!';
    }

    async function getBookedTables() {
        const tables = await db.any('SELECT * FROM table_booking WHERE booked = true');
        return tables;
    }

    async function isTableBooked(tableName) {
        const result = await db.oneOrNone('SELECT tableName FROM table_booking WHERE name = $1', [tableName]);
        return !!result;
    }

    async function cancelTableBooking(tableName) {
        await db.none('UPDATE table_booking SET booked = false WHERE name = $1', [tableName]);
        return 'Booking canceled successfully!';
    }

    async function getBookedTablesForUser(username) {
        const tables = await db.any('SELECT * FROM table_booking WHERE booked_by = $1', [username]);
        return tables;
    }

    async function areAvailableSeatsForBooking(seats) {
        const tables = await getTables();
        const availableTables = tables.filter((table) => table.capacity >= seats);
        return availableTables.length > 0;
    }

    return {
        getTables,
        bookTable,
        getBookedTables,
        isTableBooked,
        cancelTableBooking,
        getBookedTablesForUser,
        areAvailableSeatsForBooking,
    };
}


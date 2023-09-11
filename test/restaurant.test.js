import assert from "assert"
import RestaurantTableBooking from "../restaurant.js";
import pgPromise from 'pg-promise';

const DATABASE_URL = 'postgres://gszqobxa:mI7uNIVxtYUc6rzUiGaK9VgrJnkiu_XQ@dumbo.db.elephantsql.com/gszqobxa';

const connectionString = process.env.DATABASE_URL || DATABASE_URL;
const db = pgPromise()(connectionString);

describe("The restaurant booking table", function () {
    beforeEach(async function () {
        try {
            await db.none(`
                CREATE TABLE IF NOT EXISTS tables (
                    name TEXT PRIMARY KEY,
                    capacity INT,
                    booked BOOLEAN DEFAULT FALSE
                );
            `);
        } catch (err) {
            console.log(err);
            throw err;
        }
    });

    it("Get all the available tables", async function () {
        const restaurantTableBooking = await RestaurantTableBooking(db);

        assert.deepEqual([], await restaurantTableBooking.getTables());
    });


    it("It should check if the capacity is not greater than the available seats.", async function () {
        const restaurantTableBooking = await RestaurantTableBooking(db);

        const result = await restaurantTableBooking.bookTable({
            tableName: 'Table four',
            username: 'Kim',
            phoneNumber: '084 009 8910',
            seats: 3
        });

        assert.deepEqual("capacity greater than the table seats", result);
    });

    it("should check if there are available seats for a booking.", async function () {
        const restaurantTableBooking = await RestaurantTableBooking(db);
 // Get all the tables from the database
 const tables = await restaurantTableBooking.getTables();

 // Loop over the tables and see if there is a table that is not booked and has enough seats
 let availableTableFound = false;
 for (const table of tables) {
     if (!table.booked && table.capacity >= 4) {
         availableTableFound = true;
         break;
     }
 }

 // Assert that an available table was found
 assert.equal(availableTableFound, true);
     
    });

    it("Check if the booking has a user name provided.", async function () {
        const restaurantTableBooking = await RestaurantTableBooking(db);
        const result = await restaurantTableBooking.bookTable({
            tableName: 'Table eight',
            phoneNumber: '084 009 8910',
            seats: 2
        });
    
        // Check if the result is an error message indicating that a username is required
        assert.equal(result, "Please enter a username");
    });

    it("Check if the booking has a contact number provided.", async function () {
        const restaurantTableBooking = await RestaurantTableBooking(db);
        const result = await restaurantTableBooking.bookTable({
            tableName: 'Table eight',
            username: 'Kim',
            seats: 2
        });
    
        // Check if the result is an error message indicating that a contact number is required
        assert.equal(result, "Please enter a contact number");
    });

    it("should not be able to book a table with an invalid table name.", async function () {
        const restaurantTableBooking = await RestaurantTableBooking(db);

        await restaurantTableBooking.bookTable({
            tableName: 'Table eight',
            username: 'Kim',
            phoneNumber: '084 009 8910',
            seats: 2
        });

        assert.equal("Invalid table name provided", message);
    });

    it("should be able to book a table.", async function () {
        const restaurantTableBooking = await RestaurantTableBooking(db);
    
        // Check that Table three is not initially booked
        const isTableInitiallyBooked = await restaurantTableBooking.isTableBooked('Table three');
        assert.equal(isTableInitiallyBooked, false);
    
        // Attempt to book Table three
        const bookingResult = await restaurantTableBooking.bookTable({
            tableName: 'Table three',
            username: 'Kim',
            phoneNumber: '084 009 8910',
            seats: 2
        });
    
        // Check that the booking result is a success message
        assert.equal(bookingResult, 'Table booked successfully!');
    
        // Check that Table three is now booked
        const isTableBooked = await restaurantTableBooking.isTableBooked('Table three');
        assert.equal(isTableBooked, true);
    });
    
    it("should list all booked tables.", async function () {
        let restaurantTableBooking = RestaurantTableBooking(db);
        let tables = await restaurantTableBooking.getTables();
        assert.deepEqual(6, tables.length);
    });

    it("should allow users to book tables", async function () {
        const restaurantTableBooking = await RestaurantTableBooking(db);
    
        // Ensure there are no bookings for the user 'Jodie'
        const initialBookings = await restaurantTableBooking.getBookedTablesForUser('Jodie');
        assert.deepEqual(initialBookings, []);
    
        // Book Table five for 'Jodie' with 4 seats
        const booking1Result = await restaurantTableBooking.bookTable({
            tableName: 'Table five',
            username: 'Jodie',
            phoneNumber: '084 009 8910',
            seats: 4
        });
    
        // Check that booking result is a success message
        assert.equal(booking1Result, 'Table booked successfully!');
    
        // Book Table four for 'Jodie' with 2 seats
        const booking2Result = await restaurantTableBooking.bookTable({
            tableName: 'Table four',
            username: 'Jodie',
            phoneNumber: '084 009 8910',
            seats: 2
        });
    
        // Check that booking result is a success message
        assert.equal(booking2Result, 'Table booked successfully!');
    
        // Attempt to book Table five again for 'Jodie' with 4 seats
        const booking3Result = await restaurantTableBooking.bookTable({
            tableName: 'Table five',
            username: 'Jodie',
            phoneNumber: '084 009 8910',
            seats: 4
        });
    
        // Check that booking result is an error message (since the table is already booked)
        assert.equal(booking3Result, 'Table is already booked.');
    
        // Check the final list of bookings for 'Jodie'
        const finalBookings = await restaurantTableBooking.getBookedTablesForUser('Jodie');
        
        // Since the second booking attempt failed, there should only be two bookings
        assert.equal(finalBookings.length, 2);
    });
    it("should be able to cancel a table booking", async function () {
        const restaurantTableBooking = await RestaurantTableBooking(db);
    
        // Book Table five for 'Jodie' with 4 seats
        await restaurantTableBooking.bookTable({
            tableName: 'Table five',
            username: 'Jodie',
            phoneNumber: '084 009 8910',
            seats: 4
        });
    
        // Book Table four for 'Kim' with 2 seats
        await restaurantTableBooking.bookTable({
            tableName: 'Table four',
            username: 'Kim',
            phoneNumber: '084 009 8910',
            seats: 2
        });
    
        // Verify that there are initially 2 booked tables
        const initialBookedTables = await restaurantTableBooking.getBookedTables();
        assert.equal(initialBookedTables.length, 2);
    
        // Cancel the booking for 'Table four'
        await restaurantTableBooking.cancelTableBooking('Table four');
    
        // Verify that there is now only 1 booked table
        const updatedBookedTables = await restaurantTableBooking.getBookedTables();
        assert.equal(updatedBookedTables.length, 1);
    
        // Verify that the canceled table ('Table four') is not in the list of booked tables
        assert.equal(updatedBookedTables.includes('Table four'), false);
    });
    
   
    after(function () {
        db.$pool.end;
    });
})

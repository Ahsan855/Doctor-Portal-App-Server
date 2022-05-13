const express = require("express");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const port = process.env.PORT || 5000;

// middle ware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x5uuy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    console.log("database connecter");
    const servicesCollection = client
      .db("doctors_portal")
      .collection("services");
    const bookingCollection = client
      .db("doctors_portal")
      .collection("bookings");

    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = servicesCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    app.get("/available", async (req, res) => {
      const date = req.query.date || "May 11, 2022";

      //step 1: get all services
      const services = await servicesCollection.find().toArray();

      //setp 2: get the booking of that day
      const query = { date: date };
      const bookings = await bookingCollection.find(query).toArray();

      //step 3: for each service , find bookings for that service
      services.forEach((service) => {
        const serviceBooking = bookings.filter(
          (booking) => booking.treatment === service.name
        );
        const booked = serviceBooking.map((s) => s.slot);
        const available = service.slots.filter(s =>!booked.includes(s))
        service.available =available
       
      });

      res.send(services);
    });

    /**
     * APi Naming Convention 
     * app.get('/booking') //get all booking in this collection . or get more than one or by filte
     * app.get('/booking') // get a specific booking
     * app.get('/booking') // add a new booking
     * app.post('/booking) //add a new booking
     * app.post('/booking/:id)
     * app.post('/booking/:id)
     
    */

    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const query = {
        treatment: booking.treatment,
        date: booking.date,
        patient: booking.patient,
      };
      const exists = await bookingCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists });
      }
      const result = await bookingCollection.insertOne(booking);
      return res.send({ success: true, result });
    });
  } finally {
  }
}

run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Hello Form Doctor!");
});

app.listen(port, () => {
  console.log(`Doctors App listening on port ${port}`);
});

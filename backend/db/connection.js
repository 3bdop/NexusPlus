import { MongoClient, ServerApiVersion } from "mongodb";
import 'dotenv/config';

const uri = process.env.ATLAS_URI
if (!uri) {
    throw new Error("ATLAS_URI environment variable is not set.");
}

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }
})


try {
    //?Connect the client to the server
    await client.connect()

    //? Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 })

    console.log("Pinged your deployment. You successfully connected to MongoDB!")
} catch (err) {
    console.log(err)
}

let db = client.db("CareerFair");

export default db;
import express from 'express';
import mongoose from 'mongoose';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import csvParser from 'csv-parser';
import fs from 'fs'

// Connect to MongoDB
mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.tnx5w.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority&appName=Cluster0`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


const db = mongoose.connection;

db.on('error', function (error) {
  console.error('MongoDB connection error:', error);
});

// Define Mongoose schemas
const producerSchema = new mongoose.Schema({
  name: String,
  country: String,
  region: String,
});

const productSchema = new mongoose.Schema({
  vintage: String,
  name: String,
  producerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producer', // Referencing the Producer model
  },
});

// Define Mongoose models
const ProducerModel = mongoose.model('Producer', producerSchema);
const ProductModel = mongoose.model('Product', productSchema);

// Define virtual property to populate 'producer'
productSchema.virtual('producer', {
  ref: 'Producer',
  localField: 'producerId',
  foreignField: '_id',
  justOne: true,
});

// GraphQL schema
const schema = buildSchema(`
  type Product {
    _id: ID!
    vintage: String!
    name: String!
    producerId: ID!
    producer: Producer!
  }

  type Producer {
    _id: ID!
    name: String!
    country: String
    region: String
  }

  type Query {
    product(_id: ID!): Product
    productsByProducerId(producerId: ID!): [Product]
  }

  type Mutation {
    createProduct(vintage: String!, name: String!, producerId: ID!): Product
    updateProduct(_id: ID!, vintage: String, name: String): Product
    deleteProducts(ids: [ID]!): Boolean
    processCSV: Boolean
  }
`);

// GraphQL resolvers
const root = {
  product: async ({ _id }) => {
    return await ProductModel.findById(_id).populate('producer').exec();
  },
  productsByProducerId: async ({ producerId }) => {
    return await ProductModel.find({ producerId }).populate('producer').exec();
  },
  createProduct: async ({ vintage, name, producerId }) => {
    const product = new ProductModel({ vintage, name, producerId });
    await product.save();
    return product;
  },
  updateProduct: async ({ _id, vintage, name }) => {
    return await ProductModel.findByIdAndUpdate(_id, { vintage, name }, { new: true }).populate('producer').exec();
  },
  deleteProducts: async ({ ids }) => {
    await ProductModel.deleteMany({ _id: { $in: ids } });
    return true;
  },
  processCSV: async () => {
    // Read the CSV file
    const filePath = 'all_listings.csv';

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', async (data) => {
        console.log('Parsed data:', data);
        // Find or create producer
        let producer = await ProducerModel.findOne({ name: data.Producer }).exec();
        if (!producer) {
          producer = new ProducerModel({
            name: data.Producer,
            country: data.Country,
            region: data.Region,
          });
          await producer.save().then(() => {
            console.log('Producer created:', producer);
          })
        }

        // Create product
        const product = new ProductModel({
          vintage: data.Vintage,
          name: data['Product Name'],
          producerId: producer._id, // Assign producer ObjectId
          producer: {
            name: data.Producer,
            country: data.Country,
            region: data.Region
          }
        });
        await product.save();
        console.log(product)
        console.log('Product created:', product);
      })
      .on('end', async () => {
        console.log('CSV processing completed');
      })
      .on('error', (error) => {
        console.error('Error processing CSV:', error);
      });

    // Return true after processing CSV
    console.log('CSV processing started');
    return true;
  },
};

// Create Express app
const app = express();

// GraphQL endpoint
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, function () {
  console.log(`Server listening on port ${PORT}`);
});
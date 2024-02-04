// server.js
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017/medicineStore', { useNewUrlParser: true, useUnifiedTopology: true });

const medicineSchema = new mongoose.Schema({
    name: String,
    type: String,
    price: Number,
    imagePath: String,
});

const Medicine = mongoose.model('Medicine', medicineSchema);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/add-medicine', upload.single('medicineImage'), async (req, res) => {
    try {
        const { medicineName, medicineType, medicinePrice } = req.body;
        const imagePath = req.file ? req.file.path : '';

        await Medicine.create({ name: medicineName, type: medicineType, price: parseFloat(medicinePrice), imagePath });

        // Redirect to the medicines page after adding a medicine
        res.redirect('/medicines');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/medicines', async (req, res) => {
    try {
        const medicines = await Medicine.find({});
        res.render('medicines', { medicines });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.get('/edit/:id', async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);
        res.render('edit', { medicine });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/edit/:id', async (req, res) => {
    try {
        const { medicineName, medicineType, medicinePrice } = req.body;

        await Medicine.findByIdAndUpdate(req.params.id, {
            name: medicineName,
            type: medicineType,
            price: parseFloat(medicinePrice),
        });

        res.redirect('/medicines');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/delete/:id', async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);
        res.render('delete', { medicine });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/delete/:id', async (req, res) => {
    try {
        await Medicine.findByIdAndDelete(req.params.id);
        res.redirect('/medicines');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

module.exports = { Medicine };

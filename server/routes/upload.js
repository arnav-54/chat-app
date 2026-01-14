const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/auth');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'auto',
      folder: 'echochat'
    });
    
    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      type: result.resource_type
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
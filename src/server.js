const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const ngrok = require("ngrok");

const app = express();
const PORT = 3000;
const dirPath = "E:/API-mbojo_music/rawa_mbojo"; // Path lagu
const imagesPath = "E:/API-mbojo_music/images"; // Path gambar

app.use(cors());

app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  next();
});

// Fungsi untuk mengubah string menjadi Title Case
const toTitleCase = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Fungsi untuk memproses file menjadi artist dan title
const processFileName = (file) => {
  const rawFileName = path.parse(file).name;
  const parts = rawFileName.split("-");

  let artist = "Unknown";
  let title = rawFileName;

  if (parts.length === 2) {
    title = toTitleCase(parts[0].replace(/_/g, " "));
    artist = toTitleCase(parts[1].replace(/_/g, " "));
  }

  return { artist, title };
};

// Fungsi untuk mencocokkan gambar berdasarkan nama file musik
const matchImageToMusic = (musicFile) => {
  const musicName = path.parse(musicFile).name; // Nama file tanpa ekstensi
  const possibleImage = `${musicName}.jpg`; // Asumsikan gambar memiliki ekstensi .jpg
  const imagePath = path.join(imagesPath, possibleImage);

  // Periksa apakah file gambar ada
  if (fs.existsSync(imagePath)) {
    return `http://localhost:${PORT}/images/${possibleImage}`; // URL gambar
  }

  return null; // Tidak ditemukan
};

// Endpoint untuk mendapatkan daftar lagu
app.get("/api/rawambojo", (req, res) => {
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Lagu tidak bisa diakses!" });
    }

    // Map file names ke objek dengan parsing artist, title, dan gambar
    const songs = files.map((file, index) => {
      const { artist, title } = processFileName(file);
      const imageUrl = matchImageToMusic(file); // Cocokkan gambar dengan musik

      return {
        id: index + 1,
        artist,
        title,
        rawa: file,
        images: imageUrl, // URL gambar atau null jika tidak ditemukan
      };
    });

    // console.log("Songs:", JSON.stringify(songs, null, 2)); // Debug log
    res.json(songs); // Kirimkan hasil ke client
  });
});

// Endpoint untuk streaming lagu
app.get("/api/rawambojo/:rawa", (req, res) => {
  const rawa = req.params.rawa;
  const filePath = path.join(dirPath, rawa);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: "File not found" });
    }
    res.sendFile(filePath);
  });
});

// Endpoint untuk streaming gambar
app.use("/images", express.static(imagesPath));

// Jalankan server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Setup ngrok untuk menampilkan URL publik
  try {
    const url = await ngrok.connect({
      addr: PORT,
      authtoken: "2oyFIDYxIiUi5aPhGatQcIt0uoz_6LHEBxRd1BnJ5xW1DsDaf", // Token Anda
    });

    console.log(`Ngrok ingress established at: ${url}`);
  } catch (error) {
    console.error("Failed to connect to ngrok:", error);
  }
});

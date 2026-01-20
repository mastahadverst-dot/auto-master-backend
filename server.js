import express from "express";
import multer from "multer";
import cors from "cors";
import ffmpeg from "fluent-ffmpeg";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("outputs")) fs.mkdirSync("outputs");

app.use("/download", express.static("outputs"));

app.post("/auto-master", upload.single("audio"), (req, res) => {
  try {
    const genre = req.body.genre || "balanced";
    const input = req.file.path;
    const outputName = `${uuidv4()}_mastered.wav`;
    const output = path.join("outputs", outputName);

    let filter =
      "highpass=f=35,acompressor=threshold=-18dB:ratio=1.5,alimiter=limit=-1dB";

    if (genre === "soul-blues") {
      filter =
        "highpass=f=40," +
        "equalizer=f=120:width_type=o:width=1:g=1," +
        "equalizer=f=6000:width_type=o:width=1:g=2," +
        "acompressor=threshold=-18dB:ratio=2," +
        "alimiter=limit=-1dB";
    }

    ffmpeg(input)
      .audioFilters(filter)
      .audioFrequency(44100)
      .audioChannels(2)
      .on("end", () => {
        fs.unlinkSync(input);
        res.json({
          success: true,
          downloadUrl: `/download/${outputName}`
        });
      })
      .on("error", () => {
        res.status(500).json({ error: "Processing failed" });
      })
      .save(output);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(process.env.PORT || 3000);

import fs from "fs";
import path from "path";
import KnownFace from "../db/models/knownface.model.js";
import { compareFaces } from "./vision.service.js"; 


const facesDir = path.join(process.cwd(), "public", "faces");
if (!fs.existsSync(facesDir)) {
  fs.mkdirSync(facesDir, { recursive: true });
}

export const addFace = async (imageBuffer, name) => {
  const imagePath = path.join(
    "faces",
    `${name.toLowerCase()}-${Date.now()}.jpg`
  );
  const fullPath = path.join(process.cwd(), "public", imagePath);

  try {

    fs.writeFileSync(fullPath, imageBuffer);

    const newFace = await KnownFace.create({
      name,
      imagePath,
    });

    console.log(`New face added: ${name} at ${imagePath}`);
    return newFace;
  } catch (e) {
    console.error("Error adding face:", e);
    return null;
  }
};

export const recognizeFace = async (imageBuffer) => {
  const allFaces = await KnownFace.find({});

  if (allFaces.length === 0) {
    return null; 
  }


  for (const face of allFaces) {
    const savedImagePath = path.join(process.cwd(), "public", face.imagePath);
    const savedImageBuffer = fs.readFileSync(savedImagePath);


    const isMatch = await compareFaces(imageBuffer, savedImageBuffer);

    if (isMatch) {
      return face.name; 
    }
  }

  return null; 
};
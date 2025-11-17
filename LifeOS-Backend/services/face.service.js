import fs from "fs";
import path from "path";
import KnownFace from "../db/models/knownface.model.js";
import { compareFaces } from "./vision.service.js"; // We will add this function

// Make sure the 'public/faces' directory exists
const facesDir = path.join(process.cwd(), "public", "faces");
if (!fs.existsSync(facesDir)) {
  fs.mkdirSync(facesDir, { recursive: true });
}

/**
 * Saves a new face to the database
 */
export const addFace = async (imageBuffer, name) => {
  const imagePath = path.join(
    "faces",
    `${name.toLowerCase()}-${Date.now()}.jpg`
  );
  const fullPath = path.join(process.cwd(), "public", imagePath);

  try {
    // 1. Save the image file
    fs.writeFileSync(fullPath, imageBuffer);

    // 2. Save the reference in the database
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

/**
 * Tries to recognize a face from the database
 */
export const recognizeFace = async (imageBuffer) => {
  const allFaces = await KnownFace.find({});

  if (allFaces.length === 0) {
    return null; // No faces to compare against
  }

  // This is slow, but fine for a project.
  // It checks the new face against every saved face.
  for (const face of allFaces) {
    const savedImagePath = path.join(process.cwd(), "public", face.imagePath);
    const savedImageBuffer = fs.readFileSync(savedImagePath);

    // We'll use our vision service to compare
    const isMatch = await compareFaces(imageBuffer, savedImageBuffer);

    if (isMatch) {
      return face.name; // We found a match!
    }
  }

  return null; // No match found
};
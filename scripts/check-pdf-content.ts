import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import fs from "fs";

async function main() {
  const data = fs.readFileSync("public/vtu-official-syllabus/VTU-Official-BCS703-Cryptography-Syllabus.pdf");
  const textLatin = data.toString("latin1");
  const iotIdx = textLatin.indexOf("Internet of Things");
  const cryptoIdx = textLatin.indexOf("Cryptography");
  const bcsBCS703Idx = textLatin.indexOf("BCS703");
  const bcsBCS701Idx = textLatin.indexOf("BCS701");
  console.log(`PDF size: ${data.length} bytes`);
  console.log(`'Internet of Things' found at index: ${iotIdx}`);
  console.log(`'Cryptography' found at index: ${cryptoIdx}`);
  console.log(`'BCS703' found at index: ${bcsBCS703Idx}`);
  console.log(`'BCS701' found at index: ${bcsBCS701Idx}`);
  
  // Also check BCS701 IoT syllabus
  const data701 = fs.readFileSync("public/vtu-official-syllabus/VTU-Official-BCS701-IoT-Syllabus.pdf");
  const textIot = data701.toString("latin1");
  const iotIdx2 = textIot.indexOf("Internet of Things");
  const cryptoIdx2 = textIot.indexOf("Cryptography");
  console.log(`\nBCS701 IoT PDF size: ${data701.length} bytes`);
  console.log(`'Internet of Things' found at: ${iotIdx2}`);
  console.log(`'Cryptography' found at: ${cryptoIdx2}`);
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });


async function checkThumb() {
  const videoIds = [
    "nqowUJzG-iM", // Fraz
    "4EP8YLaG3dw", // Kunal
    "3OamzN90kPg", // NeetCode
    "EAR7De6Goz4", // Striver A2Z
    "WQoB2z67hvY", // Love Babbar
    "VTLCoHnyACE", // Shradha Khapra
    "y3OOaXrFy-Q", // Rohit Negi
  ];
  for (const id of videoIds) {
    const url = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    try {
      const res = await fetch(url);
      console.log(`${id} (${url}) -> ${res.status} (Content-Type: ${res.headers.get("content-type")})`);
    } catch (e: any) {
      console.log(`${id} failed:`, e.message);
    }
  }
}
checkThumb();


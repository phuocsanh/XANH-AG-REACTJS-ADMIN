import { TextField } from "@mui/material";
import { useEffect, useState } from "react";

function ItemLinkVideo({
  setVideos,
  videos,
  idx,
}: {
  videos: string[];
  setVideos: (newVideos: string[]) => void; // Sửa kiểu của setVideos tại đây
  idx: number;
}) {
  const [link, setLink] = useState("");

  useEffect(() => {
    const newVideos = [...videos];
    newVideos[idx] = link;
    setVideos(newVideos); // Gọi setVideos với newVideos
  }, [link]);

  return (
    <TextField
      className="mr-3"
      variant="outlined"
      onChange={(e) => setLink(e.target.value)}
      sx={{
        "& .MuiInputBase-input": {
          fontSize: 15,
          width: 400,
          paddingX: 2,
          paddingY: 1,
        },
      }}
    />
  );
}

export default ItemLinkVideo;

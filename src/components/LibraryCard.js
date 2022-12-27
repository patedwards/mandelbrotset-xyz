import * as React from 'react';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import { CardActionArea } from '@mui/material';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export default function MediaCard({ view, handleLoadView, removeItem }) {

  const img = window.localStorage.getItem(view.imgPath)
  return (
    <CardActionArea onClick={() => { handleLoadView(view) }}>
      <Card sx={{ width: 320, height: 320 }}>
        <CardMedia
          component="img"
          height="140"
          image={img}
          alt="green iguana"
        />
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            Lizard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lizards are a widespread group of squamate reptiles, with over 6,000
            species, ranging across all continents except Antarctica
          </Typography>
        </CardContent>
        <CardActions>
          <Button size="small">Share</Button>
          <Button size="small" onClick={() => removeItem(view)}>Delete</Button>
        </CardActions>
      </Card>
    </CardActionArea>
  );
}
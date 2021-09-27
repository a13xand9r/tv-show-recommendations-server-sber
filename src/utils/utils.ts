import { Card } from '@salutejs/scenario';
import MovieDB from 'node-themoviedb';


export const appendMovieCard = (movie: MovieDB.Objects.TVShow): Card => ({
  type: 'gallery_card',
  items: [{
    type: 'media_gallery_item',
    image: {
      url: `https://www.themoviedb.org/t/p/w600_and_h900_bestv2/${movie.poster_path}`,
      size: {
        width: 'medium',
        aspect_ratio: 1.5
      }
    },
    margins: {
      top: '5x',
      left: '5x',
      bottom: '5x',
      right: '5x',
    },
    top_text: {
      text: movie.name,
      typeface: 'title1',
      text_color: 'default',
      max_lines: 2
    },
    bottom_text: {
      text: movie.overview,
      typeface: 'footnote1',
      text_color: 'secondary'
    },
  }]
})
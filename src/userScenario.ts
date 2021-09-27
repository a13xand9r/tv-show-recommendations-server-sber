import { createIntents, createMatchers, createUserScenario, SaluteRequest } from '@salutejs/scenario';
import model from './intents.json'
import { recommendTVShow } from './movieApi';
require('dotenv').config()
const intents = createIntents(model.intents)
const { action, regexp, intent, text } = createMatchers<SaluteRequest , typeof intents>();

export const userScenario = createUserScenario({
  searchTVShow: {
    match: intent('/Найти сериал', {confidence: 0.2}),
    handle: ({req, res}) => {
      res.setPronounceText('Какой сериал тебе нравится?')
    },
    children: {
      TVShowName: {
        match: (req) => !!req.message.original_text,
        handle: async ({req, res, session}) => {
          const recommendations = await recommendTVShow(req.message.original_text)
          console.log(recommendations?.results[0])
          if (recommendations){
            session.recommendations = recommendations
            res.appendCard({
              type: 'gallery_card',
              items: [{
                type: 'media_gallery_item',
                image: {
                  url: `https://www.themoviedb.org/t/p/w220_and_h330_face/${recommendations.results[0].poster_path}`,
                  size: {
                    width: 'medium',
                    aspect_ratio: 1.5
                  }
                },
                top_text: {
                  text: recommendations.results[0].name,
                  typeface: 'caption',
                  text_color: 'default'
                },
                bottom_text: {
                  text: recommendations.results[0].overview,
                  typeface: 'footnote1',
                  text_color: 'secondary'
                },
              }]
            })
          }
        }
      }
    }
  }
})
import {
  createSaluteRequest,
  createSaluteResponse,
  createScenarioWalker,
  createSystemScenario,
  NLPRequest,
  NLPResponse,
} from '@salutejs/scenario'
import { SaluteMemoryStorage } from '@salutejs/storage-adapter-memory'
import { SmartAppBrainRecognizer } from '@salutejs/recognizer-smartapp-brain'
import { intents, userScenario } from './userScenario';


const systemScenario = createSystemScenario({
  RUN_APP: ({ req, res }, dispatch) => {
    if (req.request.payload.character.appeal === 'official') {
      res.setPronounceText('Я могу порекомендовать вам сериал на основе ваших предпочтений. Назовите сериал, который вам нравится, а я посоветую похожие.')
      res.appendBubble('Я могу порекомендовать вам сериал на основе ваших предпочтений. Назовите сериал, который вам нравится, а я посоветую похожие.')
    } else {
      res.setPronounceText('Я могу порекомендовать тебе сериал на основе твоих предпочтений. Назови сериал, который тебе нравится, а я посоветую похожие.')
      res.appendBubble('Я могу порекомендовать тебе сериал на основе твоих предпочтений. Назови сериал, который тебе нравится, а я посоветую похожие.')
    }
    dispatch && dispatch(['searchTVShow'])
  },
  NO_MATCH: ({ req, res, session }) => {
    if (req.request.payload.character.appeal === 'official'){
      if (session.recommendations){
        res.setPronounceText('Скажите \"Ещё\" для следующей рекомендации или скажите \"Другой сериал\" чтобы узнать рекомендации на основе другого сериала.')
        res.appendBubble('Скажите \"Ещё\" для следующей рекомендации или скажите \"Другой сериал\" чтобы узнать рекомендации на основе другого сериала.')
      } else{
        res.setPronounceText('Скажите \"Порекомендуй сериал\" чтобы узнать рекомендации на основе ваших предпочтений.')
        res.appendBubble('Скажите \"Порекомендуй сериал\" чтобы узнать рекомендации на основе ваших предпочтений.')
      }
    } else{
      if (session.recommendations){
        res.setPronounceText('Скажи \"Ещё\" для следующей рекомендации или скажи \"Другой сериал\" чтобы узнать рекомендации на основе другого сериала.')
        res.appendBubble('Скажи \"Ещё\" для следующей рекомендации или скажи \"Другой сериал\" чтобы узнать рекомендации на основе другого сериала.')
      } else{
        res.setPronounceText('Скажи \"Порекомендуй сериал\" чтобы узнать рекомендации на основе твоих предпочтений.')
        res.appendBubble('Скажи \"Порекомендуй сериал\" чтобы узнать рекомендации на основе твоих предпочтений.')
      }
    }
  }
})

const scenarioWalker = createScenarioWalker({
  recognizer: new SmartAppBrainRecognizer('6a0c0196-6441-4302-a2ff-9871b09eff3a'),
  intents,
  userScenario,
  systemScenario
})

const storage = new SaluteMemoryStorage()

export const handleNlpRequest = async (request: NLPRequest): Promise<NLPResponse> => {
  const req = createSaluteRequest(request)
  const res = createSaluteResponse(request)
  const sessionId = request.uuid.userId
  const session = await storage.resolve(sessionId)
  await scenarioWalker({ req, res, session })

  await storage.save({ id: sessionId, session })

  return res.message
}
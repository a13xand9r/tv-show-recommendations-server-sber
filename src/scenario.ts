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
import { userScenario } from './userScenario';


const systemScenario = createSystemScenario({
  RUN_APP: ({ req, res }, dispatch) => {
    if (req.request.payload.character.appeal === 'official') {
      res.setPronounceText('Я могу порекомендовать вам сериал на основе ваших предпочтений. Назовите сериал, который вам нравится, а я посоветую похожие.')
      res.appendBubble('Я могу порекомендовать вам сериал на основе ваших предпочтений. Назовите сериал, который вам нравится, а я посоветую похожие.')
    } else {
      res.setPronounceText('Я могу порекомендовать тебе сериал на основе ваших предпочтений. Назови сериал, который тебе нравится, а я посоветую похожие.')
      res.appendBubble('Я могу порекомендовать тебе сериал на основе ваших предпочтений. Назови сериал, который тебе нравится, а я посоветую похожие.')
    }
    dispatch && dispatch(['searchTVShow'])
  },
  NO_MATCH: ({ res }) => {
    res.setPronounceText('Не понимаю')
    res.appendBubble('Не понимаю')
  }
})

const scenarioWalker = createScenarioWalker({
  // recognizer: new SmartAppBrainRecognizer('0da03965-1326-48b8-9650-1c3e70920ffa'),
  // intents,
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
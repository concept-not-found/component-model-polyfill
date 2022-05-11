import { match } from 'patcom'
import module from './grammar/index.js'

export default (wat) => match(wat)(module)

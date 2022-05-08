import { match } from 'patcom'
import { component } from './grammar/index.js'

export default (wat) => match(wat)(component)

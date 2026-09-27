import Vue from 'vue'
import {store} from './data/store'
import App from './components/App'
import WindowPlugin from 'window-plugin'
import SchemaxPlugin from '../../../src/main/js/util/SchemaxPlugin'
import PopoutPlugin from '../../../src/main/js/util/PopoutPlugin'

Vue.use(WindowPlugin)
Vue.use(SchemaxPlugin)
Vue.use(PopoutPlugin)

new Vue({
    'el': '#app',
    store,
    render: r => r(App)
})
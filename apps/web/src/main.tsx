import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter,Link,Route,Routes} from 'react-router-dom'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {MotionConfig} from 'motion/react'
import Shell from './app/Shell'
import Home from './features/home/Home'
import Curriculum from './features/curriculum/Curriculum'
import ProgressPage from './features/progress/ProgressPage'
import LessonPage from './features/lessons/LessonPage'
import './styles/base.css'
import './styles/shell.css'

const client=new QueryClient({defaultOptions:{queries:{retry:1,refetchOnWindowFocus:false}}})
createRoot(document.getElementById('root')!).render(<StrictMode><QueryClientProvider client={client}><MotionConfig reducedMotion="user"><BrowserRouter><Routes><Route element={<Shell/>}><Route index element={<Home/>}/><Route path="curriculum" element={<Curriculum/>}/><Route path="progress" element={<ProgressPage/>}/><Route path="lessons/:slug" element={<LessonPage/>}/><Route path="*" element={<div className="wrap page-title py-16"><h1 className="serif">Page not found.</h1><Link className="text-link" to="/curriculum">Browse the curriculum →</Link></div>}/></Route></Routes></BrowserRouter></MotionConfig></QueryClientProvider></StrictMode>)


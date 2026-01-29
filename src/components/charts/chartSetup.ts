import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

let registered = false

export function ensureChartsRegistered() {
  if (registered) return
  ChartJS.register(
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
  )
  registered = true
}


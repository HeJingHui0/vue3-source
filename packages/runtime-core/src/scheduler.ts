let queue = []
let isFlushPending = false

const flushJobs = () => {
  isFlushPending = false
  queue.sort((a, b) => a.id - b.id)
  for(let i = 0; i < queue.length; i++) {
    const job = queue[i]
    job()
  }
  queue.length = 0
}

const queueFlush = () => {
  if (!isFlushPending) {
    isFlushPending = true
    Promise.resolve().then(flushJobs)
  }
}

export const queueJob = (job) => {
  if (!queue.includes(job)) {
    queue.push(job)
    queueFlush()
  }
}
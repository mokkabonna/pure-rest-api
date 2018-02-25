# Flow

This describes the various operations for each http method

## GET


```python
createIOObject()
findRoute()

if noRoute:
  return 404 Not found

if overCapacity:
  return 503 service unavailable

elif overConcurrencyLimit

  if importantRequest && maxTargetDuration < 1000:
    handleRequestNormally() #See below

  elif importantRequest && maxTargetDuration >= 1000
    persistIOData() # and pick up later
    generateStatusTrackingResponse()
    return 202

  elif
    return 503 service unavailable

else

if hasStoredResource:
  setIOBodyToStoredResource()

createProcess()
iterateWorkersInRoute()
  if connectionAlive || isAsync:
    postIOToWorker()
    persistWorkerOutput()
  else
    pauseProcessing()

if respondAsync:
  updateQueueItem()

elif
  respond()
```


# PUT

Same as above, but we don't set io body, we instead set io.existing

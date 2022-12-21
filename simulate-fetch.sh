#!/bin/sh

adb shell cmd jobscheduler run -f com.fairfood_collector 999
adb shell am broadcast -a com.fairfood_collector.event.BACKGROUND_FETCH

# (lldb)
# e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"com.transistorsoft.fetch"]
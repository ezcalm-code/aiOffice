package timeutils

import "time"

// Format 格式化时间戳为日期字符串
func Format(date int64) string {
	return time.Unix(date, 0).Format("2006-01-02")
}

// Now 获取当前时间戳
func Now() int64 {
	return time.Now().Unix()
}

// NowTime 获取当前时间
func NowTime() time.Time {
	return time.Now()
}

// Day 获取时间戳对应的日
func Day(timestamp int64) int64 {
	return int64(time.Unix(timestamp, 0).Day())
}

// Month 获取时间戳对应的月
func Month(timestamp int64) int64 {
	return int64(time.Unix(timestamp, 0).Month())
}

// Year 获取时间戳对应的年
func Year(timestamp int64) int64 {
	return int64(time.Unix(timestamp, 0).Year())
}

// FinishTime 返回完成时间相关的字段
func FinishTime() (finishAt, finishDay, finishMonth, finishYear int64) {
	now := time.Now()
	return now.Unix(), int64(now.Day()), int64(now.Month()), int64(now.Year())
}

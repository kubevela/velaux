package commands

import (
	"encoding/json"
	"fmt"
)

func printResult(res interface{}) {
	b, err := json.MarshalIndent(res, "", "  ")
	if err != nil {
		panic(err)
	}
	fmt.Println(string(b))
}

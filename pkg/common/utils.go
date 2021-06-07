package common

import "github.com/oam-dev/velacp/pkg/proto/model"

func Reverse(arr *[]*model.Properties) {
	var temp *model.Properties
	length := len(*arr)
	for i := 0; i < length/2; i++ {
		temp = (*arr)[i]
		(*arr)[i] = (*arr)[length-1-i]
		(*arr)[length-1-i] = temp
	}
}

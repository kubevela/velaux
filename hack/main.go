package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"os"
	"path"
	"regexp"
	"strings"
)

var reg = regexp.MustCompile("<Translation>(.*)</Translation>")

func main() {
	allTsxFile, err := getAllFiles(os.Args[1])
	if err != nil {
		log.Fatal(err)
	}
	keys, err := readTranslationKey(allTsxFile)
	if err != nil {
		log.Fatal(err)
	}
	data, _ := json.Marshal(keys)
	ioutil.WriteFile("zh.json", data, 0755)
}

func getAllFiles(dir string) ([]string, error) {
	files, err := ioutil.ReadDir(dir)
	if err != nil {
		return nil, err
	}
	var res []string
	for _, f := range files {
		if f.IsDir() {
			subFiles, err := getAllFiles(path.Join(dir, f.Name()))
			if err != nil {
				return nil, err
			}
			res = append(res, subFiles...)
		} else {
			if strings.HasSuffix(f.Name(), ".tsx") {
				res = append(res, path.Join(dir, f.Name()))
			}
		}
	}
	return res, nil
}

func readTranslationKey(files []string) (map[string]string, error) {
	var words = make(map[string]string)
	for _, f := range files {
		body, err := ioutil.ReadFile(f)
		if err != nil {
			return nil, err
		}
		codeBody := string(body)
		results := reg.FindAllStringSubmatch(codeBody, -1)
		for _, re := range results {
			words[re[1]] = ""
		}
	}
	return words, nil
}

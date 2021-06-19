package apis

import "github.com/oam-dev/velacp/pkg/proto/model"

type CatalogType struct {
	Name     string `json:"name"`
	Desc     string `json:"desc,omitempty"`
	UpdateAt int64  `json:"updateAt,omitempty"`
	Type     string `json:"type,omitempty"`
	Url      string `json:"url,omitempty"`
	Token    string `json:"token,omitempty"`
}

type CatalogMeta struct {
	Catalog *model.Catalog `json:"catalog"`
}

type CatalogRequest struct {
	CatalogType
	Method Action `json:"method"`
}

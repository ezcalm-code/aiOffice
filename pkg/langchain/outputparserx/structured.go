package outputparserx

import (
	"encoding/json"
	"fmt"
	"strings"
)

const (
	_structuredFormatInstructionTemplate = "The output should be a markdown code snippet formatted in the following schema: \n```json\n%s\n```"
	_structuredLineTemplate              = "\"%s\": %s // %s\n"
)

// ResponseSchema 结构化输出解析器的响应模式定义
type ResponseSchema struct {
	Name        string           // 字段名称
	Description string           // 字段描述
	Type        string           // 字段类型
	Require     bool             // 是否必填
	Schemas     []ResponseSchema // 嵌套模式
}

// Structured 结构化输出解析器
type Structured struct {
	ResponseSchemas []ResponseSchema
}

// NewStructured 创建结构化输出解析器
func NewStructured(schema []ResponseSchema) Structured {
	return Structured{
		ResponseSchemas: schema,
	}
}

// Parse 解析LLM输出为map
func (p Structured) Parse(text string) (any, error) {
	var jsonString string

	// 尝试提取markdown代码块中的JSON
	withoutJSONStart := strings.Split(text, "```json")
	if len(withoutJSONStart) > 1 {
		withoutJSONEnd := strings.Split(withoutJSONStart[1], "```")
		if len(withoutJSONEnd) < 1 {
			return nil, fmt.Errorf("parse error: no ``` at end of output")
		}
		jsonString = strings.TrimSpace(withoutJSONEnd[0])
	} else {
		jsonString = strings.TrimSpace(text)
	}

	// 解析JSON
	var parsed map[string]any
	err := json.Unmarshal([]byte(jsonString), &parsed)
	if err != nil {
		return nil, fmt.Errorf("parse error: invalid JSON: %v", err)
	}

	// 验证必填字段
	missingKeys := make([]string, 0)
	for _, rs := range p.ResponseSchemas {
		if _, ok := parsed[rs.Name]; !ok && rs.Require {
			missingKeys = append(missingKeys, rs.Name)
		}
	}

	if len(missingKeys) > 0 {
		return nil, fmt.Errorf("output is missing fields: %v", missingKeys)
	}

	return parsed, nil
}

// GetFormatInstructions 返回格式化指令
func (p Structured) GetFormatInstructions() string {
	return fmt.Sprintf(_structuredFormatInstructionTemplate, p.jsonMarshal(p.ResponseSchemas, 0))
}

func (p Structured) jsonMarshal(schemas []ResponseSchema, level int) string {
	level++

	endBlank := ""
	fieldBlank := "\t"

	for i := 0; i < level; i++ {
		fieldBlank += "\t"
		endBlank += "\t"
	}

	jsonLines := "{"
	for _, rs := range schemas {
		if len(rs.Schemas) > 0 {
			rs.Type = p.jsonMarshal(rs.Schemas, level)
		}

		blank := fieldBlank
		if len(jsonLines) == 1 {
			blank = "\t"
		}

		if len(rs.Type) == 0 {
			rs.Type = "string"
		}

		jsonLines += blank + fmt.Sprintf(_structuredLineTemplate, rs.Name, rs.Type, rs.Description)
	}

	return jsonLines + endBlank + "}"
}

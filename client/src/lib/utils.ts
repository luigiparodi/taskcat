import { createCn } from "cn/config"

export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "title-1",
            "title-2",
            "title-3",
            "heading",
            "body-lg",
            "body",
            "caption",
            "footnote",
          ],
        },
      ],
    },
  },
})
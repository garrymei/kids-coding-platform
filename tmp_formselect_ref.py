# -*- coding: utf-8 -*-
from pathlib import Path
path = Path(r'f:/project/kids-coding-platform/packages/forms/src/components/FormSelect.tsx')
text = path.read_text(encoding='utf-8')
old = "    const handleRef = (element: HTMLSelectElement | null) => {\n      if (registerRef) {\n        if (typeof registerRef === 'function') {\n          registerRef(element);\n        } else {\n          registerRef.current = element;\n        }\n      }\n\n      assignRef(ref, element);\n    };"
if old not in text:
    old = "    const handleRef = (element: HTMLSelectElement | null) => {\r\n      if (registerRef) {\r\n        if (typeof registerRef === 'function') {\r\n          registerRef(element);\r\n        } else {\r\n          registerRef.current = element;\r\n        }\r\n      }\r\n\r\n      assignRef(ref, element);\r\n    };"
new = "    const handleRef = (element: HTMLSelectElement | null) => {\n      if (registerRef) {\n        registerRef(element);\n      }\n\n      assignRef(ref, element);\n    };"
text = text.replace(old, new)
path.write_text(text, encoding='utf-8')

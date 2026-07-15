import os
import unittest
from types import SimpleNamespace

os.environ["DEBUG"] = "false"

from fastapi import HTTPException
from app.models.form import QuestionType
from app.services.form_service import _validate_answer


class FormValidationTests(unittest.TestCase):
    def question(self, kind, options=None):
        return SimpleNamespace(type=kind, options=options or [], title="Question")

    def test_text_is_trimmed(self):
        self.assertEqual(_validate_answer(self.question(QuestionType.short_answer), "  hello  "), "hello")

    def test_choice_rejects_unknown_option(self):
        with self.assertRaises(HTTPException):
            _validate_answer(self.question(QuestionType.multiple_choice, ["A", "B"]), "C")

    def test_checkboxes_are_deduplicated(self):
        value = _validate_answer(self.question(QuestionType.checkboxes, ["A", "B"]), ["A", "A", "B"])
        self.assertEqual(value, ["A", "B"])


if __name__ == "__main__":
    unittest.main()

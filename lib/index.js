import diff from "./diff.js";
import Element from "./element.js";
import patch from "./patch.js";

var virtualDOM = {
    diff: diff,
    el: Element,
    patch: patch,
};

export default virtualDOM;
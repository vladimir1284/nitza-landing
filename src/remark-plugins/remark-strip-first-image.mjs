function removeFirstImage(nodes) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === "image") {
      nodes.splice(i, 1);
      return true;
    }
    if (node.children && removeFirstImage(node.children)) {
      if (node.children.length === 0) nodes.splice(i, 1);
      return true;
    }
  }
  return false;
}

export function remarkStripFirstImage() {
  return (tree) => {
    removeFirstImage(tree.children);
  };
}

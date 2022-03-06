All of the pages in the demo project so far have not used any dynamic data
during rendering. In real projects, this is not often the case. Often you need
to read a file from disk (markdown for a blog post), or fetch some user data
from an API or database.

These operations are all asynchronous. Rendering however, is always synchronous.
To make this work anyway, `fresh` provides a way

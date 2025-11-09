from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import BlogPost
from .forms import BlogPostForm


def post_list(request):
    """List all published blog posts"""
    posts = BlogPost.objects.filter(published=True)
    return render(request, "blog/post_list.html", {"posts": posts})


def post_detail(request, pk):
    """View a single blog post"""
    post = get_object_or_404(BlogPost, pk=pk, published=True)
    return render(request, "blog/post_detail.html", {"post": post})


@login_required
def post_create(request):
    """Create a new blog post"""
    if request.method == "POST":
        form = BlogPostForm(request.POST)
        if form.is_valid():
            post = form.save(commit=False)
            post.author = request.user
            post.save()
            return redirect("post_detail", pk=post.pk)
    else:
        form = BlogPostForm()

    return render(request, "blog/post_form.html", {"form": form, "action": "Create"})


@login_required
def post_edit(request, pk):
    """Edit an existing blog post"""
    post = get_object_or_404(BlogPost, pk=pk, author=request.user)

    if request.method == "POST":
        form = BlogPostForm(request.POST, instance=post)
        if form.is_valid():
            form.save()
            return redirect("post_detail", pk=post.pk)
    else:
        form = BlogPostForm(instance=post)

    return render(request, "blog/post_form.html", {"form": form, "action": "Edit"})

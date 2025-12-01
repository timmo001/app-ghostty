# ~/.bashrc - Shell configuration for Ghostty addon

# If not running interactively, don't do anything
case $- in
    *i*) ;;
      *) return;;
esac

# History settings
HISTCONTROL=ignoreboth
HISTSIZE=1000
HISTFILESIZE=2000
shopt -s histappend

# Check window size after each command
shopt -s checkwinsize

# Enable color support
if [ -x /usr/bin/dircolors ]; then
    test -r ~/.dircolors && eval "$(dircolors -b ~/.dircolors)" || eval "$(dircolors -b)"
fi

# Home Assistant blue theme color (#03a9f4)
HA_BLUE="03a9f4"

# ============================================================================
# Tool Initialization
# ============================================================================

# Starship prompt
if command -v starship &> /dev/null; then
    eval "$(starship init bash)"
fi

# Zoxide (smart cd)
if command -v zoxide &> /dev/null; then
    eval "$(zoxide init bash)"
fi

# FZF keybindings and completion
if command -v fzf &> /dev/null; then
    # Source fzf keybindings if available
    [ -f /usr/share/doc/fzf/examples/key-bindings.bash ] && source /usr/share/doc/fzf/examples/key-bindings.bash
    [ -f /usr/share/bash-completion/completions/fzf ] && source /usr/share/bash-completion/completions/fzf
    
    # FZF with Home Assistant blue theme
    export FZF_DEFAULT_OPTS="
        --color=fg:-1,bg:-1,hl:#${HA_BLUE}
        --color=fg+:-1,bg+:-1,hl+:#${HA_BLUE}
        --color=info:#${HA_BLUE},prompt:#${HA_BLUE},pointer:#${HA_BLUE}
        --color=marker:#${HA_BLUE},spinner:#${HA_BLUE},header:#${HA_BLUE}
    "
fi

# ============================================================================
# Aliases - Debian package name mappings
# ============================================================================

# bat is installed as batcat on Debian
if command -v batcat &> /dev/null; then
    alias bat='batcat'
    alias cat='batcat --paging=never'
    export BAT_THEME="base16"
fi

# fd is installed as fdfind on Debian
if command -v fdfind &> /dev/null; then
    alias fd='fdfind'
fi

# ============================================================================
# eza aliases (modern ls replacement)
# ============================================================================

if command -v eza &> /dev/null; then
    # eza colors with Home Assistant blue for directories
    export EZA_COLORS="di=38;2;3;169;244:ln=38;2;3;169;244:da=38;2;3;169;244"
    
    alias ls='eza --icons --group-directories-first'
    alias ll='eza -la --icons --group-directories-first'
    alias la='eza -a --icons --group-directories-first'
    alias lt='eza --tree --icons --group-directories-first'
    alias l='eza -l --icons --group-directories-first'
else
    # Fallback to standard ls with colors
    alias ls='ls --color=auto'
    alias ll='ls -la'
    alias la='ls -A'
    alias l='ls -l'
fi

# ============================================================================
# Other useful aliases
# ============================================================================

alias grep='grep --color=auto'
alias fgrep='fgrep --color=auto'
alias egrep='egrep --color=auto'

# Ripgrep alias
if command -v rg &> /dev/null; then
    alias rg='rg --color=auto'
fi

# ============================================================================
# Bash completion
# ============================================================================

if ! shopt -oq posix; then
    if [ -f /usr/share/bash-completion/bash_completion ]; then
        . /usr/share/bash-completion/bash_completion
    elif [ -f /etc/bash_completion ]; then
        . /etc/bash_completion
    fi
fi

# ============================================================================
# Welcome message (fastfetch)
# ============================================================================

if command -v fastfetch &> /dev/null; then
    fastfetch
fi

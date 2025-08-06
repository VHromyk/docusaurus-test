import React from 'react';

export default function PostMeta({category}) {
    return (
        <div>
            Published in <strong>{category}</strong>
        </div>
    );
}
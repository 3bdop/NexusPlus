import React from 'react';
import styled from 'styled-components';

const Button = ({ val, onClick, color, disabled }) => {
  return (
    <StyledWrapper color={color} hidden={disabled}>
      <button id="btn" onClick={onClick} disabled={disabled}>{val}</button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  button {
    padding: 10px 20px;
    text-transform: uppercase;
    border-radius: 8px;
    font-size: 17px;
    font-weight: 500;
    color: #FFFFFF9A;
    text-shadow: none;
    background: transparent;
    cursor: pointer;
    box-shadow: transparent;
    border: 1px solid #ffffff80;
    transition: 0.5s ease;
    user-select: none;
  }
  #btn:hover,
  #btn:focus {
    color: #ffffff;
    background: ${props => props.color || '#0ef'};
    border: 1px solid ${props => props.color || '#0ef'};
    text-shadow: 0 0 5px #ffffff, 0 0 10px #ffffff, 0 0 20px #ffffff;
    box-shadow: 0 0 5px ${props => props.color || '#0ef'}, 
                0 0 20px ${props => props.color || '#0ef'}, 
                0 0 50px ${props => props.color || '#0ef'}, 
                0 0 100px ${props => props.color || '#0ef'};
    scale: 1.2;
  }
  #btn:active {
    transform: scale(0.8);
  }`;

export default Button;
